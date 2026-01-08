import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea"
import { HTMLAttributes, SyntheticEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { MessageFeedbackRating } from "../../components/message-feedback/message-feedback-rating";
import {adminApiClient} from "../../admin/lib/admin-client";
import {cn} from "../../admin/lib/utils";
import {LoadingSpinner} from "../../components/utils/spinner";


interface MessageFeedbackFormProps {
  messageId: number | null;
}

export function MessageFeedbackForm({ messageId }: MessageFeedbackFormProps, { className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    const feedbackData = {
      rating: rating,
      feedback: feedback,
    };

    try {
      await adminApiClient.conversations().updateMessageFeedback(messageId, feedbackData);
      setIsSubmitted(true);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            {isError && (
              <Alert variant="destructive">
                <AlertTitle>There was an error submitting your feedback.</AlertTitle>
                <AlertDescription>Please contact user support.</AlertDescription>
              </Alert>
            )}

            <Label className="sr-only" htmlFor="rating">Rating</Label>
            <MessageFeedbackRating disabled={isSubmitted} rating={rating} onRatingChange={setRating} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              disabled={isSubmitted}
              onChange={(event) => setFeedback(event.target.value)}
              className="bg-white"
              placeholder="Type your feedback here."
            />
          </div>

          <Button disabled={isLoading || isSubmitted} type="submit">
            { isSubmitted ?
              <>Thank you for your feedback!</>
              :
              <>
                {isLoading && <LoadingSpinner />}
                Submit Feedback
              </>
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
