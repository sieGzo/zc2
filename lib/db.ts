type User = { email: string; password: string }
const users: User[] = []

export function addUser(user: User) {
  users.push(user)
}

export function findUser(email: string) {
  return users.find(u => u.email === email)
}
