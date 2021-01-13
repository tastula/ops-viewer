import { LocalDateRange } from ".";

export default interface OrganisationRoleShare {
    educationalInstitutionUrn: string | null;
    organisationId: string;
    roleUrn: string;
    share: number;
    validityPeriod: LocalDateRange;
}
