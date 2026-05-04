import request from "supertest";
import { prisma } from "../jest.setup";
import { app } from "../src/app";

describe("URL shortener API", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a custom alias", async () => {
    const response = await request(app)
      .post("/api/v1/short")
      .send({ longURL: "https://www.google.com", customAlias: "myurl" });

    expect(response.status).toBe(201);
    expect(response.body.data.alias.alias).toBe("myurl");

    const output = await prisma.alias.findUnique({
      where: { alias: "myurl" },
    });
    expect(output).not.toBeNull();
  });

  it("should redirect to the long URL", async () => {
    const response = await request(app).get("/api/v1/myurl");

    expect(response.status).toBe(301);
    expect(response.header.location).toMatch(/google/);
  });
});
