import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-sans rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-[linear-gradient(hsl(var(--success)/0.1),hsl(var(--success)/0.1)),linear-gradient(hsl(var(--background)),hsl(var(--background)))] group-[.toaster]:text-success group-[.toaster]:border-success/30",
          error: "group-[.toaster]:bg-[linear-gradient(hsl(var(--destructive)/0.1),hsl(var(--destructive)/0.1)),linear-gradient(hsl(var(--background)),hsl(var(--background)))] group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
          info: "group-[.toaster]:bg-[linear-gradient(hsl(var(--primary)/0.1),hsl(var(--primary)/0.1)),linear-gradient(hsl(var(--background)),hsl(var(--background)))] group-[.toaster]:text-primary group-[.toaster]:border-primary/30",
          warning: "group-[.toaster]:bg-[linear-gradient(hsl(var(--warning)/0.1),hsl(var(--warning)/0.1)),linear-gradient(hsl(var(--background)),hsl(var(--background)))] group-[.toaster]:text-[hsl(32_90%_36%)] dark:group-[.toaster]:text-warning group-[.toaster]:border-warning/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
