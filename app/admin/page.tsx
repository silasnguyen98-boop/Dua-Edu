"use client";

import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { GeneralDashboard } from "./components/GeneralDashboard";
import { ClassManagementView } from "./components/ClassManagementView";
import { AssistantAssignmentsView } from "./components/AssistantAssignmentsView";
import { ClassDetailView } from "./components/ClassDetailView";
import { ClassDashboardView } from "./components/ClassDashboardView";
import { AdminsView } from "./components/AdminsView";
import { DataTableSection } from "./components/DataTableSection";
import { AttendanceView } from "./components/AttendanceView";
import { ScoreView } from "./components/ScoreView";
import { CertGuideModal } from "./components/CertGuideModal";
import { StudentDetailModal } from "./components/StudentDetailModal";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { AssignAssistantModal } from "./components/AssignAssistantModal";

export default function Home() {
  const admin = useAdmin();

  if (admin.isAuthenticated === null) return <div className="loading-screen"><div className="loader"></div></div>;
  if (!admin.isAuthenticated) return null;

  return (
    <div className="admin-container">
      <Sidebar
        activeView={admin.activeView}
        changeView={admin.setActiveView}
        openSidebarGroup={admin.openSidebarGroup}
        toggleSidebarGroup={admin.setOpenSidebarGroup}
        isAssistantUser={admin.isAssistantUser}
        tableConfigs={admin.tableConfigs}
        data={admin.data}
        visibleClassItems={admin.visibleClassItems}
      />

      <main className="admin-main">
        <Topbar
          pageEyebrow={admin.pageEyebrow}
          pageTitle={admin.pageTitle}
          pageDescription={admin.pageDescription}
          activeTable={admin.activeTable}
          isSaving={admin.isSaving}
          isDataView={admin.isDataView}
          isAssistantUser={admin.isAssistantUser}
          isClassDetailView={admin.isClassDetailView}
          isAssistantAssignmentsView={admin.isAssistantAssignmentsView}
          currentAccount={admin.currentAccount}
          roleLabels={admin.roleLabels}
          onShowCertGuide={() => admin.setShowCertGuide(true)}
          onSyncCertificates={() => void admin.syncCertificates()}
          onRefresh={() => void admin.loadAllTables()}
          onBackToClasses={() => admin.setActiveView("classManagement")}
          onDownloadTemplate={() => void admin.downloadTemplate()}
          onExportData={() => admin.exportData()}
          onImportClick={() => admin.fileInputRef.current?.click()}
          onLogout={() => void admin.onLogout()}
        />

        <input
          onChange={(e) => void admin.importExcel(e)}
          ref={admin.fileInputRef}
          style={{ display: "none" }}
          type="file"
        />

        <div className="admin-content">
          {admin.error && (
            <div className="alert alert-error" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", fontSize: "14px", fontWeight: 500 }}>
              {admin.error}
            </div>
          )}
          {admin.message && (
            <div className="alert alert-success" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: "14px", fontWeight: 500 }}>
              {admin.message}
            </div>
          )}
          {admin.activeView === "dashboard" && (
            <GeneralDashboard
              stats={admin.stats}
              analytics={admin.analytics}
              students={admin.data.students}
            />
          )}

          {admin.activeView === "classManagement" && (
            <ClassManagementView
              visibleClassItems={admin.visibleClassItems}
              assignedClassIds={admin.assignedClassIds}
              currentUserRole={admin.currentUserRole}
              onOpenDashboard={(id) => { admin.setSelectedAttendanceClassId(id); admin.setActiveView("classDashboard"); }}
              onOpenDetail={(id) => { admin.setSelectedClassId(id); admin.setActiveView("classDetail"); }}
              formatValue={admin.formatValue}
            />
          )}

          {admin.activeView === "classDetail" && admin.selectedClass && (
            <ClassDetailView
              selectedClass={admin.selectedClass}
              selectedClassEnrollments={admin.selectedClassEnrollments}
              onSyncCertificates={(id, type) => void admin.syncCertificates(id)}
              onUpdateStatus={admin.updateEnrollmentStatus}
              updatingEnrollmentId={admin.updatingEnrollmentId}
              classStatusFilter={admin.classStatusFilter}
              setClassStatusFilter={admin.setClassStatusFilter}
              isLoading={admin.isLoading}
              isSaving={admin.isSaving}
              onExportExcel={admin.exportData}
              onBack={() => admin.setActiveView("classManagement")}
              formatValue={admin.formatValue}
            />
          )}

          {admin.activeView === "classDashboard" && (
            <ClassDashboardView
              visibleClassItems={admin.visibleClassItems}
              selectedAttendanceClassId={admin.selectedAttendanceClassId}
              setSelectedAttendanceClassId={admin.setSelectedAttendanceClassId}
              selectedAttendanceSession={admin.selectedAttendanceSession}
              setSelectedAttendanceSession={admin.setSelectedAttendanceSession}
              attendanceSessionCount={admin.attendanceSessionCount}
              classDashboardMetrics={admin.classDashboardMetrics}
              classDashboardMode={admin.classDashboardMode}
              setClassDashboardMode={admin.setClassDashboardMode}
              segmentCriteria={admin.segmentCriteria}
              setSegmentCriteria={admin.setSegmentCriteria}
              selectedAttendanceClass={admin.selectedAttendanceClass}
              attendanceRecords={admin.attendanceRecords}
              attendanceError={admin.attendanceError}
            />
          )}

          {admin.activeView === "assistantAssignments" && (
            <AssistantAssignmentsView
              assignedAssistantTotal={admin.assignedAssistantTotal}
              visibleClassItems={admin.visibleClassItems}
              assistantAssignmentClassItems={admin.assistantAssignmentClassItems}
              assistantAssignmentsByClass={admin.assistantAssignmentsByClass}
              assistantUserByProfileId={admin.assistantUserByProfileId}
              onRefresh={admin.loadAssistantAssignmentOverview}
              onOpenAssignModal={(id) => admin.setShowAssignModal(id)}
            />
          )}

          {admin.activeView === "attendance" && (
            <AttendanceView
              visibleClassItems={admin.visibleClassItems}
              selectedAttendanceClassId={admin.selectedAttendanceClassId}
              setSelectedAttendanceClassId={admin.setSelectedAttendanceClassId}
              selectedAttendanceSession={admin.selectedAttendanceSession}
              setSelectedAttendanceSession={admin.setSelectedAttendanceSession}
              attendanceRecordsByEnrollment={admin.attendanceRecordsByEnrollment}
              selectedClassEnrollments={admin.selectedClassEnrollments}
              isSaving={admin.isSaving}
              onUpdateAttendance={(eid, status) => admin.updateAttendance(eid, admin.selectedAttendanceSession, status)}
              onRefresh={admin.loadAllTables}
              attendanceSessionCount={admin.attendanceSessionCount}
              attendanceError={admin.attendanceError}
            />
          )}

          {(admin.activeView === "assignmentScore" || admin.activeView === "projectScore") && (
            <ScoreView
              type={admin.activeView === "assignmentScore" ? "assignment" : "project"}
              visibleClassItems={admin.visibleClassItems}
              selectedClassId={admin.selectedAttendanceClassId}
              onClassChange={admin.setSelectedAttendanceClassId}
              selectedEnrollments={admin.selectedClassEnrollments}
              isSaving={admin.isSaving}
              onUpdateScore={(eid, score) => {
                if (admin.activeView === "assignmentScore") {
                  admin.updateAssignmentScore(eid, admin.selectedAttendanceSession, String(score));
                } else {
                  admin.updateProjectScore(eid, admin.selectedAttendanceSession, String(score));
                }
              }}
              onRefresh={admin.loadAllTables}
              error={admin.error}
              selectedSession={admin.selectedAttendanceSession}
              setSelectedSession={admin.setSelectedAttendanceSession}
              sessionCount={admin.attendanceSessionCount}
            />
          )}

          {admin.activeView === "admins" && (
            <AdminsView
              adminForm={admin.adminForm}
              setAdminForm={admin.setAdminForm}
              isSaving={admin.isSaving}
              setIsSaving={admin.setIsSaving}
              setError={admin.setError}
              setMessage={admin.setMessage}
              adminUsers={admin.adminUsers}
              loadAdmins={admin.loadAdmins}
              accountTab={admin.accountTab}
              setAccountTab={admin.setAccountTab}
              supabase={admin.supabase}
              createUser={admin.createUser}
              updateUser={admin.updateUser}
              deleteUser={admin.deleteUser}
              genPassword={admin.genPassword}
            />
          )}

          {!["dashboard", "classManagement", "classDetail", "classDashboard", "assistantAssignments", "attendance", "assignmentScore", "projectScore", "admins"].includes(admin.activeView) && (
            <DataTableSection
              activeTable={admin.activeTable}
              isAssistantUser={admin.isAssistantUser}
              activeConfig={admin.activeConfig}
              editingRow={admin.editingRow}
              resetForm={admin.resetForm}
              form={admin.form}
              updateFormValue={admin.updateFormValue}
              data={admin.data}
              getOptionLabel={admin.getOptionLabel}
              saveRow={admin.saveRow}
              classSessionsFilterId={admin.classSessionsFilterId}
              setClassSessionsFilterId={admin.setClassSessionsFilterId}
              search={admin.search}
              setSearch={admin.setSearch}
              pageSize={admin.pageSize}
              setPageSize={admin.setPageSize}
              currentPage={admin.currentPage}
              setCurrentPage={admin.setCurrentPage}
              totalPages={admin.totalPages}
              isSaving={admin.isSaving}
              startEdit={admin.startEdit}
              deleteRow={admin.deleteRow}
              setSelectedStudentForDetail={admin.setSelectedStudentForDetail}
              getFieldValue={admin.getFieldValue}
              getScoreClass={admin.getScoreClass}
              studentAccountForm={admin.studentAccountForm}
              setStudentAccountForm={admin.setStudentAccountForm}
              createStudentLoginAccount={admin.createStudentLoginAccount}
              relationQueries={admin.relationQueries}
              setRelationQueries={admin.setRelationQueries}
              openRelationPicker={admin.openRelationPicker}
              setOpenRelationPicker={admin.setOpenRelationPicker}
              getRelationLabel={admin.getRelationLabel}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {admin.showAssignModal && (
        <AssignAssistantModal
          show={!!admin.showAssignModal}
          selectedClassId={admin.showAssignModal}
          adminUsers={admin.adminUsers}
          classAssistants={admin.classAssistants}
          onClose={() => admin.setShowAssignModal(null)}
          onAssign={async (uid) => {
            await admin.assignAssistantToClass(admin.showAssignModal!, uid);
            const res = await admin.loadClassAssistants(admin.showAssignModal!);
            admin.setClassAssistants(res);
          }}
          onRemove={async (aid) => {
            await admin.removeAssistantFromClass(aid);
            const res = await admin.loadClassAssistants(admin.showAssignModal!);
            admin.setClassAssistants(res);
          }}
          isSaving={admin.isSaving}
        />
      )}

      {admin.selectedStudentForDetail && (
        <StudentDetailModal
          student={admin.selectedStudentForDetail}
          onClose={() => admin.setSelectedStudentForDetail(null)}
          data={admin.data}
          onEdit={(s) => {
            admin.setSelectedStudentForDetail(null);
            admin.setActiveView("students");
            admin.startEdit(s);
          }}
        />
      )}

      {admin.selectedSessionDetail && (
        <SessionDetailModal
          session={admin.selectedSessionDetail}
          onClose={() => admin.setSelectedSessionDetail(null)}
          onEdit={(s) => {
            admin.setSelectedSessionDetail(null);
            admin.setActiveView("class_sessions");
            admin.startEdit(s);
          }}
        />
      )}

      {admin.showCertGuide && <CertGuideModal show={admin.showCertGuide} onClose={() => admin.setShowCertGuide(false)} />}
    </div>
  );
}
