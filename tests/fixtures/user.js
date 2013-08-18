var fixtures = typeof(fixtures) === "object" ? fixtures : {};

fixtures.user = {
    'preferences': {
        "timezone": null,
        "datepref": "m/d/Y",
        "timepref": "H:i",
        "currency_id": "-99",
        "currency_name": "US Dollars",
        "currency_symbol": "$",
        "currency_iso": "USD",
        "currency_rate": 1,
        "decimal_precision": "2",
        "decimal_separator": ".",
        "number_grouping_separator": ",",
    },
    "type": "support_portal",
    "user_id": "seed_sally_id",
    "user_name": "SugarCustomerSupportPortalUser",
  'acl': {
      "Cases":{
          "fields": {
                    "name": {
                        "write": "yes"
                    }, "status": {
                        "write": "no",
                        "create": "no"
                    }
                },
                "admin": "no",
                "developer": "no",
                "access": "yes",
                "view": "yes",
                "list": "yes",
                "edit": "yes",
                "delete": "yes",
                "import": "yes",
                "export": "yes",
                "massupdate": "yes",
                "create": "yes",
                "_hash": "c2dd34be3e193dd127eb7ab69d413cc6"
      },
      "Accounts":{
          "fields": {
                    "name": {
                        "write": "yes"
                    }, "status": {
                        "write": "no"
                    }
                },
                "admin": "yes",
                "developer": "no",
                "access": "yes",
                "view": "yes",
                "list": "yes",
                "edit": "no",
                "delete": "yes",
                "import": "yes",
                "export": "yes",
                "massupdate": "yes",
                "create": "yes",
                "_hash": "3435464127eb7ab69d413cc6"
      },
      "noAccessModule":{
          "admin": "no",
          "developer": "no",
          "access": "no",
          "view": "yes",
          "list": "yes",
          "edit": "no",
          "delete": "yes",
          "import": "yes",
          "export": "yes",
          "massupdate": "yes",
          "create": "yes",
          "_hash": "3435464127eb7ab69d413cc6"
      },
      "ownerOnly":{
          "admin": "no",
          "developer": "no",
          "access": "yes",
          "view": "no",
          "list": "no",
          "edit": "yes",
          "delete": "no",
          "import": "no",
          "export": "no",
          "massupdate": "no",
          "create": "no",
          "_hash": "3435464127eb7ab69d413cc6"
      },
      "adminOnly":{
          "admin": "yes",
          "developer": "no",
          "access": "yes",
          "view": "no",
          "list": "no",
          "edit": "yes",
          "delete": "no",
          "import": "no",
          "export": "no",
          "massupdate": "no",
          "create": "no",
          "_hash": "3435464127eb7ab69d413cc6"
      },
      "Contacts":{
          "fields": {
              "name": {
                  "write": "yes"
              }, "email": {
                  "create": "no",
                  "write": "no"
              },
              "first_name": {
                  "write": "yes"
              },
              "last_name": {
                  "write": "no"
              },
              "address": {
                  "create": "no",
                  "write": "no"
              }
          },
          "admin": "no",
          "developer": "no",
          "access": "yes",
          "create": "yes",
          "view": "yes",
          "list": "yes",
          "edit": "yes",
          "delete": "yes",
          "import": "yes",
          "export": "yes",
          "massupdate": "yes",
          "create": "yes",
          "_hash": "3435464127eb7ab69d413cc6"
      }
  }
};
