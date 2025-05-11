import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a
  .schema({
    UserProfile: a
      .model({
        email: a.string(),
        profileOwner: a.string(),
      })
      .authorization((allow) => [
        allow.ownerDefinedIn("profileOwner"),
      ]),
    Person: a
      .model({
        first_name: a.string().required(),
        middle_names: a.string(),
        last_name: a.string().required(),
        gender: a.string(),
        birth_date: a.date(),
        birth_place: a.string(),
        death_date: a.date(),
        death_place: a.string(),
        age_at_death: a.string(),
        burial_place: a.string(),
      })
      .authorization((allow) => [
        allow.authenticated().to(["read", "create", "update", "delete"]),
        allow.guest().to(["read"]),
      ]),
  })
  .authorization((allow) => [allow.resource(postConfirmation)]);
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});