export type JwtPayload = {
  id: string;
  email: string;
  role: "admin" | "customer";
  iat?: number;
  exp?: number;
};