import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { Class } from "@shared/schema";

interface UpdateReviewsButtonProps {
  classItem: Class;
  onUpdate?: (updatedClass: Class) => void;
}

export default function UpdateReviewsButton({ classItem, onUpdate }: UpdateReviewsButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateReviews = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/classes/${classItem.id}/update-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reviews updated:', data);
        if (onUpdate && data.updatedClass) {
          onUpdate(data.updatedClass);
        }
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        console.error('Failed to update reviews');
      }
    } catch (error) {
      console.error('Error updating reviews:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={updateReviews}
      disabled={isUpdating}
      size="sm"
      variant="outline"
      className="ml-2"
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
      {isUpdating ? 'Updating...' : 'Update Reviews'}
    </Button>
  );
}