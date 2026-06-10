import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsModal = ({
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
          <DialogTitle className="text-xl">Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: June 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                1. Acceptance of Terms
              </h3>
              <p>
                By creating an account and using TeamSync ("the Service"), you agree to be bound
                by these Terms of Service ("Terms"). If you do not agree to these Terms, you must
                not use the Service. These Terms constitute a legally binding agreement between you
                ("User") and the TeamSync development team.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                2. User Accounts
              </h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You must provide accurate,
                current, and complete information during the registration process. You must notify
                us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                3. User Responsibilities
              </h3>
              <p>
                As a user, you agree to use the Service in compliance with all applicable laws and
                regulations. You are solely responsible for the content you create, share, or store
                using the Service. You must not use the Service for any illegal or unauthorized
                purpose.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                4. Acceptable Use Policy
              </h3>
              <p>
                You agree not to misuse the Service by: (a) interfering with or disrupting the
                integrity or performance of the Service; (b) attempting to gain unauthorized access
                to the Service or its related systems; (c) transmitting any viruses, malware, or
                harmful code; (d) engaging in any activity that could damage, disable, or impair
                the Service's infrastructure.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                5. Workspace and Team Management
              </h3>
              <p>
                Workspace owners and administrators have the ability to manage members, roles, and
                permissions within their workspaces. TeamSync is not responsible for the actions
                taken by workspace administrators regarding member management or content access.
                Workspace data is owned by the workspace creator and their organization.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                6. Intellectual Property
              </h3>
              <p>
                The Service, including its code, design, layout, and branding, is the intellectual
                property of the TeamSync development team. You may not copy, modify, distribute,
                sell, or lease any part of the Service without explicit permission. User-generated
                content remains the property of the respective user or organization.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                7. Service Availability
              </h3>
              <p>
                We strive to provide uninterrupted access to the Service, but we do not guarantee
                that the Service will be available at all times. TeamSync reserves the right to
                perform maintenance, updates, or suspend the Service temporarily without prior
                notice. We are not liable for any downtime or loss of data resulting from
                scheduled or emergency maintenance.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                8. Account Suspension and Termination
              </h3>
              <p>
                TeamSync reserves the right to suspend or terminate your account at any time if
                you violate these Terms or engage in conduct that could harm the Service or other
                users. You may delete your account at any time through your profile settings.
                Upon termination, your data will be handled in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                9. Limitation of Liability
              </h3>
              <p>
                TeamSync is provided "as is" without any warranties, express or implied. In no
                event shall the TeamSync development team be liable for any direct, indirect,
                incidental, special, or consequential damages arising from your use of or
                inability to use the Service, even if we have been advised of the possibility
                of such damages.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                10. Changes to Terms
              </h3>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective
                immediately upon posting. Your continued use of the Service after any changes
                constitutes acceptance of the updated Terms. We will make reasonable efforts to
                notify users of material changes via email or through the Service.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                11. Contact Information
              </h3>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
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

export default TermsModal;
