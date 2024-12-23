import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  return hashedPassword;
};

export const correctPassword = async (
  candidatePassword: string,
  currentPassword: string
) => {
    return await bcrypt.compare(candidatePassword, currentPassword)
};

