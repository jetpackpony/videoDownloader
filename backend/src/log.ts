export function log(message: string): void {
  const NODE_ENV = process.env.NODE_ENV || "development";
  NODE_ENV === "development" && console.log(message);
}
