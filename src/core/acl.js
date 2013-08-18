/*********************************************************************************
 * The contents of this file are subject to the SugarCRM Master Subscription
 * Agreement (""License"") which can be viewed at
 * http://www.sugarcrm.com/crm/master-subscription-agreement
 * By installing or using this file, You have unconditionally agreed to the
 * terms and conditions of the License, and You may not use this file except in
 * compliance with the License.  Under the terms of the license, You shall not,
 * among other things: 1) sublicense, resell, rent, lease, redistribute, assign
 * or otherwise transfer Your rights to the Software, and 2) use the Software
 * for timesharing or service bureau purposes such as hosting the Software for
 * commercial gain and/or for the benefit of a third party.  Use of the Software
 * may be subject to applicable fees and any use of the Software without first
 * paying applicable fees is strictly prohibited.  You do not have the right to
 * remove SugarCRM copyrights from the source code or user interface.
 *
 * All copies of the Covered Code must include on each user interface screen:
 *  (i) the ""Powered by SugarCRM"" logo and
 *  (ii) the SugarCRM copyright notice
 * in the same form as they appear in the distribution.  See full license for
 * requirements.
 *
 * Your Warranty, Limitations of liability and Indemnity are expressly stated
 * in the License.  Please refer to the License for the specific language
 * governing these rights and limitations under the License.  Portions created
 * by SugarCRM are Copyright (C) 2004-2012 SugarCRM, Inc.; All Rights Reserved.
 ********************************************************************************/
(function(app) {
    /**
     * Checks ACL for modules and fields.
     *
     * @class Core.Acl
     * @singleton
     * @alias SUGAR.App.acl
     */
    app.augment("acl", {

        /**
         * Dictionary that maps actions to permissions.
         * @property {Object}
         */
        action2permission: {
            "view": "read",
            "readonly": "read",
            "edit": "write",
            "detail": "read",
            "list": "read",
            "disabled": "write"
        },

        /**
         * Checks ACLs to see if access is given to action.
         *
         * @param {String} action Action name.
         * @param {Object} acls ACL hash.
         * @return {Boolean} Flag indicating if the current user has access to the given action.
         */        
        _hasAccess: function(action, acls) {
            var access;

            if (acls["access"] === "no") {
                access = "no";
            }
            else {
                access = acls[action];
            }

            return access !== "no";
        },

        /**
         * Checks ACLs to see if access is given to action on a given field.
         *
         * @param {String} action Action name.
         * @param {Object} acls ACL hash.
         * @param {String} field Name of the model field.
         * @return {Boolean} Flag indicating if the current user has access to the given action.
         */
        _hasAccessToField: function(action, acls, field) {
            var access;

            action = this.action2permission[action] || action;
            if(acls.fields[field] && acls.fields[field][action]) {
                access = acls.fields[field][action];
            }

            return access !== "no";
        },

        /**
         * Checks acls to see if the current user has access to action on a given module's field.
         *
         * @param {String} action Action name.
         * @param {Object} module Module name.
         * @param {String} ownerId(optional) ID of the record's owner (`assigned_user_id` attribute).
         * @param {String} field(optional) Name of the model field.
         * @param {String} recordAcls(optional) a record's acls.
         * @return {Boolean} Flag indicating if the current user has access to the given action.
         */
        hasAccess: function(action, module, ownerId, field, recordAcls) {
            //TODO Also add override for app full admins remember to add a test this means you
            var acls = app.user.getAcls()[module];
            var access = true;
            if(acls || recordAcls) {
                acls = acls || {};
                if (recordAcls) { // A record's acls take precedence over the module acls. If they are available, merge the acls.
                    acls = app.utils.deepCopy(acls); // deep clone acls
                    acls.fields = acls.fields || {};
                    _.extend(acls.fields, recordAcls.fields); // merge the field acls
                    var fields = acls.fields;
                    _.extend(acls, recordAcls); // merge record's acls with the module acls (shallow)
                    acls.fields = fields; // use the merged field acls

                }
                access = this._hasAccess(action, acls);
                if(field && acls.fields && access) {
                    // see if we have access to the field
                    access = this._hasAccessToField(action, acls, field);
                    // if the field is in a group, see if we have access to the group
                    var moduleMeta = app.metadata.getModule(module);
                    var fieldMeta = (moduleMeta && moduleMeta.fields) ? moduleMeta.fields[field] : null;
                    if (access && fieldMeta && fieldMeta.group) {
                        access = this._hasAccessToField(action, acls, fieldMeta.group);
                    }
                }
            }


            return access;
        },

        /**
         * Checks ACLs to see if the current user has access to action on a given model's field.
         *
         * @param {String} action Action name.
         * @param {Object} model(optional) Model instance.
         * @param {String} field(optional) Name of the model field.
         * @return {Boolean} Flag indicating if the current user has access to the given action.
         */
        hasAccessToModel: function(action, model, field) {
            var id, module, assignedUserId, acls,
                access = true;
            if (model) {
                id = model.id;
                module = model.module;
                assignedUserId = model.original_assigned_user_id || model.get("assigned_user_id");
                acls = model.get('_acl') || { fields: {} };
            }

            if (action == 'edit' && !id) {
                action = 'create';
            }

            if (access === true) {
                access = this.hasAccess(action, module, assignedUserId, field, acls);
            }

            return access;
        }
    });

})(SUGAR.App);
