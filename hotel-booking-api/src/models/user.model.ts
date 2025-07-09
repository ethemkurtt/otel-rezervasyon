export type UserRole = "customer" | "admin"

export type User = {
  _id?: string
  fullName: string
  email: string
  phone: string
  birthDate: string
  password: string
  role: UserRole
  createdAt: Date
}
