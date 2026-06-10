import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl">Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: June 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                1. Information We Collect
              </h3>
              <p>
                We collect information you provide directly to us when you create an account,
                create or manage workspaces, projects, and tasks, or communicate with other
                users through our platform. This information is necessary to provide and improve
                the Service.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                2. Account Information
              </h3>
              <p>
                When you register for an account, we collect your name, email address, and
                profile picture (if provided). If you sign in using OAuth providers (Google,
                GitHub), we receive the profile information you have authorized the provider
                to share with us, including your email address and name.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                3. Usage Data
              </h3>
              <p>
                We automatically collect certain information about your use of the Service,
                including your IP address, browser type, device information, pages visited,
                and feature interactions. This data helps us understand how the Service is
                used and improve the user experience.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                4. Cookies and Tracking Technologies
              </h3>
              <p>
                We use cookies and similar tracking technologies to maintain your session,
                remember your preferences, and analyze usage patterns. Session cookies are
                essential for authentication and are deleted when you close your browser.
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                5. How We Use Information
              </h3>
              <p>
                We use the collected information to: provide, maintain, and improve the
                Service; authenticate your identity and secure your account; communicate
                with you about updates, security alerts, and support; monitor and analyze
                usage trends; and enforce our Terms of Service.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                6. Data Security
              </h3>
              <p>
                We implement industry-standard security measures to protect your data,
                including encryption in transit (TLS/SSL) and at rest, secure session
                management, and regular security audits. However, no method of electronic
                storage or transmission is 100% secure, and we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                7. Data Retention
              </h3>
              <p>
                We retain your account information for as long as your account is active.
                Workspace and project data is retained for the duration of workspace
                existence. If you delete your account, we will delete or anonymize your
                personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                8. Third-Party Services
              </h3>
              <p>
                We may use third-party services for infrastructure (hosting, database),
                authentication (Google OAuth, GitHub OAuth), and email delivery. These
                providers have their own privacy policies governing the use of your data.
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                9. User Rights
              </h3>
              <p>
                You have the right to access, correct, or delete your personal data at any
                time through your account settings. You may request a copy of your data or
                restrict processing by contacting us. We will respond to your requests
                within 30 days in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                10. Account Deletion
              </h3>
              <p>
                You can delete your account at any time from your profile settings. Account
                deletion will remove your personal information and disassociate you from
                all workspaces. Workspace owners and administrators may retain workspace
                data even after you leave a workspace or delete your account.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                11. Contact Information
              </h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=h4rshal.workspace@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  h4rshal.workspace@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyModal;
