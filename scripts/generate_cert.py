import sys
import os
from PIL import Image, ImageDraw, ImageFont

def generate_full_certificate(name, course, date, cert_id, output_path, cert_type="completion"):
    # Đường dẫn phôi sạch
    template_path = "public/cert-bg-clean.png"
    
    if not os.path.exists(template_path):
        print(f"Error: Template not found at {template_path}")
        return

    # Mở ảnh
    img = Image.open(template_path)
    draw = ImageDraw.Draw(img)
    W, H = img.size # 1024 x 724

    # Cấu hình Font (Tương thích Linux/Docker)
    def get_font(font_name, size):
        # Ưu tiên font trong project
        local_path = os.path.join("public", "fonts", font_name)
        if os.path.exists(local_path):
            return ImageFont.truetype(local_path, size)
        # Fallback Linux paths
        linux_paths = [
            f"/usr/share/fonts/truetype/dejavu/{font_name}",
            f"/usr/share/fonts/truetype/liberation/{font_name}",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        ]
        for p in linux_paths:
            if os.path.exists(p): return ImageFont.truetype(p, size)
        return ImageFont.load_default()

    font_logo = get_font("Arial_Bold.ttf", 40)
    font_slogan = get_font("Arial.ttf", 16)
    font_title = get_font("Arial_Bold.ttf", 36)
    font_certify = get_font("Arial_Bold_Italic.ttf", 22)
    font_name = get_font("Arial_Bold.ttf", 54)
    font_course = get_font("Arial_Bold_Italic.ttf", 32)
    font_desc = get_font("Arial.ttf", 18)
    font_footer = get_font("Arial.ttf", 18)
    font_id = get_font("Arial_Bold.ttf", 14)

    def draw_center(text, y, font, fill="#1a202c"):
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((W-w)/2, y), text, fill=fill, font=font)

    # 1. Header: Logo & Slogan
    try:
        logo = Image.open("public/logo.png").convert("RGBA")
        base_w = 140
        w_percent = (base_w / float(logo.size[0]))
        h_size = int((float(logo.size[1]) * float(w_percent)))
        logo = logo.resize((base_w, h_size), Image.LANCZOS)
        img.paste(logo, (int((W-base_w)/2), 60), logo)
        start_y = 60 + h_size + 40
    except Exception as e:
        print(f"Logo error: {e}")
        draw_center("DUA Edu", 65, font_logo, fill="#065f46")
        draw_center("Data Upgrade Ability", 110, font_slogan, fill="#059669")
        start_y = 165

    # Logic nội dung dựa trên loại chứng nhận
    ctype_lower = cert_type.lower()
    if ctype_lower == "participation" or ctype_lower == "tham gia":
        title_text = "CERTIFICATE OF PARTICIPATION"
        desc_text = "has successfully participated in the course"
    else:
        title_text = "COURSE CERTIFICATE"
        desc_text = "has successfully completed the course"

    # 2. Main Titles
    draw_center(title_text, start_y, font_title, fill="#000000")
    
    # Kẻ dòng trang trí
    draw.line([(350, start_y + 50), (674, start_y + 50)], fill="#000000", width=2)
    
    draw_center("DUA Edu proudly certifies", start_y + 75, font_certify, fill="#1a202c")

    # 3. Student Info
    draw_center(name.upper(), start_y + 145, font_name, fill="#064e3b")
    draw_center(desc_text, start_y + 220, font_desc, fill="#000000")
    
    # 4. Course Info
    draw_center(course, start_y + 270, font_course, fill="#1a202c")

    # 5. Long Description
    desc = "This certificate is awarded to the student for successfully participating" if cert_type == "participation" else "This certificate is awarded to the student for successfully completing"
    desc2 = "all course content and practical exercises."
    draw_center(desc, 500, font_desc, fill="#1a202c")
    draw_center(desc2, 525, font_desc, fill="#1a202c")

    # 6. Footer: Date & ID & Signature Area
    draw.text((100, 590), f"Issue date: {date}", fill="#1a202c", font=font_footer)
    
    # Chèn Chữ ký
    try:
        sig = Image.open("public/signature.png").convert("RGBA")
        sig_w = 90
        w_percent = (sig_w / float(sig.size[0]))
        sig_h = int((float(sig.size[1]) * float(w_percent)))
        sig = sig.resize((sig_w, sig_h), Image.LANCZOS)
        img.paste(sig, (690, 600), sig)
        draw.text((630, 580), "DUA Edu Representative", fill="#1a202c", font=font_footer)
    except Exception as e:
        print(f"Signature error: {e}")
        draw.text((630, 560), "DUA Edu Representative", fill="#1a202c", font=font_footer)
    
    # Certificate ID
    bbox = draw.textbbox((0, 0), f"Certificate ID: {cert_id}", font=font_id)
    w = bbox[2] - bbox[0]
    draw.text(((W-w)/2, 675), f"Certificate ID: {cert_id}", fill="#4b5563", font=font_id)

    # Lưu ảnh
    img.save(output_path)
    print(f"Success: Full certificate saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python3 generate_cert.py 'Name' 'Course' 'Date' 'ID' 'Output_Path' [Type]")
    else:
        ctype = sys.argv[6] if len(sys.argv) > 6 else "completion"
        generate_full_certificate(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], ctype)
