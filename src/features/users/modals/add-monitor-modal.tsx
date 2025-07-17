import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrent } from "@/features/auth/api/use-current";
import { AuthError } from "@supabase/supabase-js";
import { useAddMonitorModal } from "../store/use-add-monitor";
import MonitorAddForm from "../forms/monitor-add-form";

function AddMonitorModal() {
  const [open, setOpen] = useAddMonitorModal();
  const { data: user, isSuccess, isLoading } = useCurrent();
  if (user instanceof AuthError || !user) return;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Transformez un compte client en compte Moniteur
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d&apos;ajouter un moniteur à votre
            entreprise.
          </DialogDescription>
        </DialogHeader>

        <MonitorAddForm />
      </DialogContent>
    </Dialog>
  );
}

export default AddMonitorModal;
