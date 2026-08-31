import { encodeBase62 } from "../../core/base62";
import { SnowflakeGenerator } from "../../core/id-generator";
import type { UrlCodeGeneratorInterface } from "./url-code.generator.interface";

export class UrlCodeGenerator
  implements UrlCodeGeneratorInterface
{
  private readonly snowflake: SnowflakeGenerator;

  constructor(workerId: bigint) {
    this.snowflake = new SnowflakeGenerator(
      workerId
    );
  }

  generate(): string {
    const id = this.snowflake.generate();

    return encodeBase62(id);
  }
}