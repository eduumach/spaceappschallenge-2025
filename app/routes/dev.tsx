import { Header } from "@radix-ui/react-accordion";
import { useToast } from "~/components/toast-provider";
import { Button } from "~/components/ui/button";

export default function Dev() {
    const toast = useToast()
    function handleToast() {
        toast.showToast("This is a toast message!", 'destructive');
    }
    return (
        <div className="min-h-screen bg-background">
            
            <Button onClick={handleToast}>Show Toast</Button>
        </div>
    )
}