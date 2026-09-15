/** Return value of every public form action, consumed by React's useActionState. */
export type FormState = {
  status: "idle" | "success" | "error";
  /** Form-level problem (verification failed, program closed, storage failed, ...). */
  formError?: string;
  /** Validation messages keyed by field name. */
  fieldErrors?: Record<string, string[]>;
  /**
   * The submitted values, echoed back on error so the form can repopulate itself
   * (React resets uncontrolled form fields after a form action completes).
   */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };
