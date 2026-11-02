import { SubmitButton } from "./AdminForm";

/**
 * Save-bar buttons for content with a draft/published state. The main button
 * always leaves the item published; the other keeps (or makes) it a draft.
 * Server actions read the button as `intent`: "publish" | "draft".
 */
export function PublishButtons({ published }: { published?: boolean }) {
  return published ? (
    <>
      <SubmitButton intent="draft" variant="secondary">
        Unpublish
      </SubmitButton>
      <SubmitButton intent="publish">Save changes</SubmitButton>
    </>
  ) : (
    <>
      <SubmitButton intent="draft" variant="secondary">
        Save as draft
      </SubmitButton>
      <SubmitButton intent="publish">Publish</SubmitButton>
    </>
  );
}
