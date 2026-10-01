import { moderatePostContent } from "@/lib/postModeration";

describe("post moderation", () => {
  it("always flags explicit profanity even if the AI says the post is clean", async () => {
    const classifier = jest.fn().mockResolvedValue({ inappropriate: false, reason: null });

    await expect(moderatePostContent("fuck you", classifier)).resolves.toEqual({
      inappropriate: true,
      reason: "Contains profanity.",
    });
    expect(classifier).not.toHaveBeenCalled();
  });

  it("catches profanity separated by punctuation", async () => {
    const classifier = jest.fn().mockResolvedValue({ inappropriate: false, reason: null });

    await expect(moderatePostContent("F.U.C.K you", classifier)).resolves.toMatchObject({
      inappropriate: true,
    });
  });

  it("returns the classifier decision for clearly inappropriate content", async () => {
    const classifier = jest.fn().mockResolvedValue({
      inappropriate: true,
      reason: "Contains profanity.",
    });

    await expect(moderatePostContent("bad content", classifier)).resolves.toEqual({
      inappropriate: true,
      reason: "Contains profanity.",
    });
  });

  it("fails open to manual review when classification is unavailable", async () => {
    const classifier = jest.fn().mockRejectedValue(new Error("provider unavailable"));

    await expect(moderatePostContent("job description", classifier)).resolves.toBeNull();
  });
});