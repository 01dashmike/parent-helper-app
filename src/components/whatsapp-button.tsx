import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Class } from "@shared/schema";

interface WhatsAppButtonProps {
  classItem: Class;
  variant?: "concierge" | "direct";
  size?: "sm" | "default" | "lg";
}

export default function WhatsAppButton({ classItem, variant = "concierge", size = "sm" }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    let phoneNumber: string;
    let message: string;

    if (variant === "direct" && classItem.whatsappNumber) {
      // Direct contact for premium providers (Baby Sensory trial)
      phoneNumber = classItem.whatsappNumber;
      message = `Hi! I'm interested in your ${classItem.name} class in ${classItem.town}. Could you please provide more details about availability and booking?`;
    } else {
      // Concierge service through Parent Helper
      phoneNumber = "447368235567"; // Your Parent Helper WhatsApp business number
      message = `Hi Parent Helper! I'm interested in "${classItem.name}" in ${classItem.town} on ${classItem.dayOfWeek}s at ${classItem.time}. Can you help me get in touch with the provider?`;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open in new window/tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      size={size}
      variant="outline"
      className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      WhatsApp
    </Button>
  );
}