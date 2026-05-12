-- Function to handle automatic certificate sync
CREATE OR REPLACE FUNCTION public.handle_enrollment_certificate_sync()
RETURNS TRIGGER AS $$
DECLARE
    cert_type TEXT;
    cert_code TEXT;
    class_code TEXT;
    existing_id UUID;
    existing_type TEXT;
BEGIN
    -- Calculate certificate type (lowercase to match constraint)
    IF COALESCE(NEW.attendance_score, 0) >= 4 AND COALESCE(NEW.project_score, 0) > 0 AND COALESCE(NEW.final_score, 0) >= 4 THEN
        cert_type := 'completion';
    ELSIF COALESCE(NEW.attendance_score, 0) >= 2 AND COALESCE(NEW.assignment_score, 0) > 0 THEN
        cert_type := 'participation';
    ELSE
        cert_type := NULL;
    END IF;

    IF cert_type IS NOT NULL THEN
        -- Check if certificate already exists
        SELECT id, certificate_type INTO existing_id, existing_type FROM public.certificates WHERE enrollment_id = NEW.id LIMIT 1;

        IF existing_id IS NULL THEN
            -- Generate code
            SELECT c.class_code INTO class_code 
            FROM public.classes c 
            WHERE c.id = NEW.class_id;
            
            IF class_code IS NULL OR class_code = '' THEN class_code := 'EDU'; END IF;
            
            cert_code := class_code || '-' || UPPER(SUBSTRING(cert_type FROM 1 FOR 4)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

            INSERT INTO public.certificates (
                enrollment_id,
                certificate_type,
                certificate_code,
                status,
                issued_at
            ) VALUES (
                NEW.id,
                cert_type,
                cert_code,
                'issued',
                NOW()
            );
        ELSIF existing_type != cert_type THEN
            -- Update type if it upgraded (participation -> completion)
            IF existing_type = 'participation' AND cert_type = 'completion' THEN
                UPDATE public.certificates 
                SET certificate_type = cert_type,
                    issued_at = NOW(),
                    note = COALESCE(note, '') || ' [Auto-upgraded from participation on ' || NOW()::TEXT || ']'
                WHERE id = existing_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_enrollment_score_change ON public.enrollments;
CREATE TRIGGER on_enrollment_score_change
AFTER INSERT OR UPDATE OF attendance_score, assignment_score, project_score, final_score
ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.handle_enrollment_certificate_sync();
