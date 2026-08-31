const CHARACTERS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function encodeBase62(value: bigint): string {
  if (value === 0n) {
    return "0";
  }

  let result = "";
  let number = value;

  while (number > 0n) {
    const remainder = Number(number % 62n);

    result =
      CHARACTERS[remainder] + result;

    number /= 62n;
  }

  return result;
}