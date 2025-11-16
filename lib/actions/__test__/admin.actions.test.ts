import { NewFactorListInstance } from "twilio/lib/rest/verify/v2/service/entity/newFactor";
import { isValidUUID } from "../admin.actions";
import { describe, it } from "vitest";



describe('Test', () => {
    it('Test', async() => {
        const UUID = "notanUUID";
        expect(isValidUUID(UUID) === false)
    })

})