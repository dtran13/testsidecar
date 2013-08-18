describe("Relationships", function() {
    var dm = SUGAR.App.data, metadata;
    beforeEach(function() {
        SugarTest.seedMetadata();
    });

    describe("Factory", function() {
        it("should be able to create a related bean instance from a bean ID", function() {
            var opportunity = dm.createBean("Opportunities"), attrs, contact;
            opportunity.id = "opp-1";

            attrs = { first_name: "John", last_name: "Smith", contact_role: "Decision Maker" };
            contact = dm.createRelatedBean(opportunity, "contact-1", "contacts", attrs);

            expect(contact.link).toBeDefined();
            expect(contact.link.name).toEqual("contacts");
            expect(contact.link.bean).toEqual(opportunity);
            expect(contact.link.isNew).toBeTruthy();
            expect(contact.id).toEqual("contact-1");
            expect(contact.get("first_name")).toEqual("John");
            expect(contact.get("last_name")).toEqual("Smith");
            expect(contact.get("contact_role")).toEqual("Decision Maker");
        });

        it("should be able to create a related bean instance from a bean", function() {
            var opportunity = dm.createBean("Opportunities"), attrs, contact, relation;
            opportunity.id = "opp-1";

            attrs = { id: "contact-1", first_name: "John", last_name: "Smith", contact_role: "Decision Maker" };
            contact = dm.createBean("Contacts", attrs);
            relation = dm.createRelatedBean(opportunity, contact, "contacts");

            expect(contact).toEqual(relation);
            expect(contact.link).toBeDefined();
            expect(contact.link.name).toEqual("contacts");
            expect(contact.link.bean).toEqual(opportunity);
            expect(contact.id).toEqual("contact-1");
            expect(contact.get("first_name")).toEqual("John");
            expect(contact.get("last_name")).toEqual("Smith");
            expect(contact.get("contact_role")).toEqual("Decision Maker");
        });

        it("should be able to create a new related bean instance", function() {
            var opportunity = dm.createBean("Opportunities"), attrs, contact;
            opportunity.id = "opp-1";

            attrs = { id: "contact-1", first_name: "John", last_name: "Smith", contact_role: "Decision Maker" };
            contact = dm.createRelatedBean(opportunity, null, "contacts", attrs);

            expect(contact.link).toBeDefined();
            expect(contact.link.name).toEqual("contacts");
            expect(contact.link.bean).toEqual(opportunity);
            expect(contact.id).toEqual("contact-1");
            expect(contact.get("first_name")).toEqual("John");
            expect(contact.get("last_name")).toEqual("Smith");
            expect(contact.get("contact_role")).toEqual("Decision Maker");
        });

        it("should be able to create a collection of related beans", function() {
            var opportunity = dm.createBean("Opportunities");
            opportunity.id = "opp-1";

            var contacts = dm.createRelatedCollection(opportunity, "contacts");

            expect(contacts.module).toEqual("Contacts");
            expect(contacts.link).toBeDefined();
            expect(contacts.link.name).toEqual("contacts");
            expect(contacts.link.bean).toEqual(opportunity);
            expect(opportunity.getRelatedCollection("contacts")).toEqual(contacts);
        });

    });

    describe("Utils", function() {

        it("should be able to check if a module can have multiple related beans", function() {
            expect(dm.canHaveMany("Opportunities", "contacts")).toBeTruthy();
            expect(dm.canHaveMany("Opportunities", "accounts")).toBeFalsy();
            expect(dm.canHaveMany("Opportunities", "calls")).toBeTruthy();
        });

        it("should be able to get related module name", function() {
            expect(dm.getRelatedModule("Opportunities", "contacts")).toEqual("Contacts");
            expect(dm.getRelatedModule("Opportunities", "calls")).toEqual("Calls");
            expect(dm.getRelatedModule("Opportunities", "accounts")).toEqual("Accounts");
        });

        it("should be able to get a related field", function() {
            var relatedField = dm.getRelateFields("Accounts", "cases");
            expect(relatedField).toBeDefined();
            expect(relatedField.length).toEqual(1);
            expect(relatedField[0].name).toEqual("account_name");
        });

        it("should be able to get relationship fields", function() {
            var fields = dm.getRelationshipFields("Opportunities", "contacts");
            expect(fields).toBeDefined();
            expect(fields.length).toEqual(1);
            expect(fields[0]).toEqual("opportunity_role");
        });

    });

    describe("CRUD", function() {

        var server;

        beforeEach(function() {
            SugarTest.seedFakeServer();
            server = SugarTest.server;
        });

        it("should be able to fetch related beans", function() {
            var opportunity = dm.createBean("Opportunities"), contacts;
            opportunity.id = "1";

            server.respondWith("GET", /\/Opportunities\/1\/link\/contacts/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/opportunities/1/link/contacts"].GET.response)]);

            contacts = dm.createRelatedCollection(opportunity, "contacts");
            contacts.fetch({ relate: true });
            server.respond();

            expect(server.requests[0].requestBody).toBeNull();
            expect(contacts.length).toEqual(3);
            expect(contacts.link.isNew).toBeFalsy();
            _.each([
                "6beade8e-ea5c-1906-203f-4f501294939e",
                "877df603-25c8-a601-198c-4f50124b0366",
                "8c440c9c-7357-54d2-7b43-4f5012552ba9"
            ], function(id) {
                var contact = contacts.get(id);
                expect(contact).toBeDefined();
                expect(contact.get("first_name")).toBeDefined();
                expect(contact.get("last_name")).toBeDefined();
                expect(contact.get("opportunity_role")).toBeDefined();
                expect(contact.link).toEqual(contacts.link);
                expect(contact.link.isNew).toBeFalsy();
            });
        });

        it("should be able to create a related bean", function() {
            var opportunity = dm.createBean("Opportunities"), contact;
            opportunity.id = "1";
            contact = dm.createRelatedBean(opportunity, null, "contacts", {
                first_name: "John",
                last_name: "Smith",
                opportunity_role: "Influencer"
            });

            server.respondWith("POST", /\/Opportunities\/1\/link\/contacts/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/opportunities/1/link/contacts"].POST.response)]);

            contact.save(null, { relate: true });
            server.respond();

            expect(server.requests[0].requestBody).toEqual('{"first_name":"John","last_name":"Smith","opportunity_role":"Influencer","field_0":100}');
            expect(contact.id).toEqual("2");
            expect(contact.get("date_modified")).toBeDefined();
            expect(contact.link.isNew).toBeFalsy();
            expect(opportunity.get("date_modified")).toBeDefined();
        });

        it("should be able to delete a relationship", function() {
            var opportunity = dm.createBean("Opportunities"), contact;
            opportunity.id = "1";
            contact = dm.createRelatedBean(opportunity, null, "contacts", { id: "2" });

            server.respondWith("DELETE", /\/Opportunities\/1\/link\/contacts\/2/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/opportunities/1/link/contacts"].DELETE.response)]);

            contact.destroy({ relate: true });
            server.respond();

            expect(server.requests[0].requestBody).toBeNull();
            expect(opportunity.get("date_modified")).toBeDefined();
            expect(contact.get("date_modified")).toBeDefined();
            expect(contact.link).toBeUndefined();
        });

        it("should be able to update a relationship", function() {
            var opportunity = dm.createBean("Opportunities"), contact;
            opportunity.id = "1";
            contact = dm.createRelatedBean(opportunity, null, "contacts",
                { id: "2", opportunity_role: "Primary Decision Maker" });
            // Indicate that this relationship is an existing one
            contact.link.isNew = false;

            server.respondWith("PUT", /\/Opportunities\/1\/link\/contacts\/2/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/opportunities/1/link/contacts"].PUT.response)]);

            contact.save(null, { relate: true });
            server.respond();

            expect(server.requests[0].requestBody).toEqual('{"id":"2","opportunity_role":"Primary Decision Maker"}');
            expect(opportunity.get("date_modified")).toBeDefined();
            expect(contact.get("date_modified")).toBeDefined();
        });

        it("should be able to create a relationship for two existing beans", function() {
            var opportunity = dm.createBean("Opportunities"), contact;
            opportunity.id = "1";
            contact = dm.createRelatedBean(opportunity, null, "contacts",
                { id: "2", opportunity_role: "Influencer" });

            server.respondWith("POST", /\/Opportunities\/1\/link\/contacts\/2/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/opportunities/1/link/contacts"].POST.response)]);

            contact.save(null, { relate: true });
            server.respond();

            expect(server.requests[0].requestBody).toEqual('{"id":"2","opportunity_role":"Influencer"}');
            expect(opportunity.get("date_modified")).toBeDefined();
            expect(contact.get("date_modified")).toBeDefined();
            expect(contact.link.isNew).toBeFalsy();
        });

    });

});
