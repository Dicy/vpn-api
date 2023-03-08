import { describe, expect, it } from "vitest";
import worker from "../../utils";

describe("Register", () => {
  it("validation should fail", async () => {
    const resp = await worker().fetch("/v1/public/register", {
      method: "POST",
      body: JSON.stringify({
        name: "x",
        email: "y",
        password: "z"
      })
    });
    if (resp) {
      expect(resp.status).toBe(400);
      const text = await resp.text();
      expect(text).toMatchInlineSnapshot('"{\\"success\\":false,\\"error\\":{\\"issues\\":[{\\"code\\":\\"too_small\\",\\"minimum\\":4,\\"type\\":\\"string\\",\\"inclusive\\":true,\\"exact\\":false,\\"message\\":\\"String must contain at least 4 character(s)\\",\\"path\\":[\\"name\\"]},{\\"validation\\":\\"email\\",\\"code\\":\\"invalid_string\\",\\"message\\":\\"Invalid email\\",\\"path\\":[\\"email\\"]},{\\"code\\":\\"too_small\\",\\"minimum\\":8,\\"type\\":\\"string\\",\\"inclusive\\":true,\\"exact\\":false,\\"message\\":\\"String must contain at least 8 character(s)\\",\\"path\\":[\\"password\\"]}],\\"name\\":\\"ZodError\\"}}"');
    }
  });
});