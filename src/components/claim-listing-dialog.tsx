import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  claimListingSchema,
  type ClaimListingData,
  type Class,
} from "@shared/schema";
import { Mail, Phone, ShieldCheck } from "lucide-react";

interface ClaimListingDialogProps {
  classItem: Class;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerClassName?: string;
}

const defaultValues: ClaimListingData = {
  fullName: "",
  email: "",
  phone: "",
  role: "",
  website: "",
  proofUrl: "",
  message: "",
  contactPreference: "email",
  consentToEmail: false,
};

export function ClaimListingDialog({
  classItem,
  triggerLabel = "Claim this listing",
  triggerVariant = "outline",
  triggerClassName,
}: ClaimListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClaimListingData>({
    resolver: zodResolver(claimListingSchema),
    defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: ClaimListingData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/classes/${classItem.id}/claim`,
        values,
      );
      await response.json();
      setIsSubmitted(true);
      toast({
        title: "Request received!",
        description:
          "Thanks for verifying your business. We'll review and be in touch shortly.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Unable to submit claim",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={triggerClassName}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Claim this listing</DialogTitle>
          <DialogDescription>
            Tell us a little about your connection to this class so we can
            verify ownership and give you edit access.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">
                {classItem.name}
              </div>
              <div className="text-muted-foreground">
                {classItem.venue || "Venue details coming soon"}
              </div>
            </div>
            <div className="flex gap-2">
              {classItem.town && (
                <Badge variant="secondary">{classItem.town}</Badge>
              )}
              {classItem.category && (
                <Badge variant="secondary" className="capitalize">
                  {classItem.category}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Thanks for confirming!
              </h3>
              <p className="text-sm text-muted-foreground">
                Our team will review your details and reach out within 1-2
                working days.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your full name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Alex Taylor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your role *</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner, manager, instructor..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proofUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proof link</FormLabel>
                      <FormControl>
                        <Input placeholder="Link to Companies House, social page..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else we should know? *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Share details that help us verify you're part of this business."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred contact method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-3">
                          <RadioGroupItem value="email" id="contact-email" />
                          <Label
                            htmlFor="contact-email"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Mail className="h-4 w-4" /> Email
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-3">
                          <RadioGroupItem value="phone" id="contact-phone" />
                          <Label
                            htmlFor="contact-phone"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Phone className="h-4 w-4" /> Phone
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentToEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <div className="space-y-1 text-sm">
                      <FormLabel className="text-sm font-medium">
                        I confirm I'm authorised to act for this business and I'm
                        happy for Parent Helper to contact me.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Submit claim"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ClaimListingDialog;
