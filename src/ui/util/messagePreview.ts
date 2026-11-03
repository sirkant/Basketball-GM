import DOMPurify from "dompurify";

// Strip markup before decoding entities. No images, links or embedded content
// are inserted into a preview; the original body stays in the message reader.
export const messagePreview = (html: string) =>
	new DOMParser()
		.parseFromString(
			DOMPurify.sanitize(
				html.replace(/<\/(?:p|li|h[1-6])>|<br\s*\/?\s*>/gi, " "),
				{ ALLOWED_TAGS: [] },
			),
			"text/html",
		)
		.body.textContent?.replace(/\s+/g, " ")
		.trim() ?? "";
