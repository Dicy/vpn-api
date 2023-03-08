export class Reply extends Response {
  constructor(message: any, statusCode: number = 200, headers?: { [key: string]: string }) {
    super(Reply.getMessageJson(message), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });
  }

  private static getMessageJson(message: any) {
    if (message instanceof Error) {
      return JSON.stringify({ message: message.message });
    } else if (typeof message === "string") {
      return JSON.stringify({ message: message });
    }
    return JSON.stringify(message);
  }

  public static ok(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 200, headers);
  }

  public static badRequest(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 400, headers);
  }

  public static unauthorized(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 401, headers);
  }

  public static forbidden(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 403, headers);
  }

  public static notFound(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 404, headers);
  }

  public static conflict(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 409, headers);
  }

  public static serverError(message: any, headers?: { [key: string]: string }) {
    return new Reply(message, 500, headers);
  }
}
