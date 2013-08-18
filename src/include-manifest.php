<?php
/*********************************************************************************
 * The contents of this file are subject to the SugarCRM Master Subscription
 * Agreement ("License") which can be viewed at
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
 *  (i) the "Powered by SugarCRM" logo and
 *  (ii) the SugarCRM copyright notice
 * in the same form as they appear in the distribution.  See full license for
 * requirements.
 *
 * Your Warranty, Limitations of liability and Indemnity are expressly stated
 * in the License.  Please refer to the License for the specific language
 * governing these rights and limitations under the License.  Portions created
 * by SugarCRM are Copyright (C) 2004-2012 SugarCRM, Inc.; All Rights Reserved.
 ********************************************************************************/
 //Sidecar Lite: no jQuery
$buildFiles = array(
    'sidecar.lite' => array(
        # The real deal
        'lib/sugarapi/sugarapi.js',
        'src/app.js',
        'src/utils/utils.js',
        'src/utils/date.js',
        'src/utils/file.js',
        'src/utils/math.js',
        'src/utils/currency.js',
        'src/core/cache.js',
        'src/core/events.js',
        'src/core/before-event.js',
        'src/core/error.js',
        'src/view/template.js',
        'src/core/context.js',
        'src/core/controller.js',
        'src/core/router.js',
        'src/core/language.js',
        'src/core/metadata-manager.js',
        'src/core/acl.js',
        'src/core/user.js',
        'src/core/plugin-manager.js',
        'src/utils/logger.js',
        'src/data/bean.js',
        'src/data/bean-collection.js',
        'src/data/mixed-bean-collection.js',
        'src/data/data-manager.js',
        'src/data/validation.js',
        'src/view/hbs-helpers.js',
        'src/view/view-manager.js',
        'src/view/component.js',
        'src/view/view.js',
        'src/view/field.js',
        'src/view/layout.js',
        'src/view/alert.js',
        'src/view/tutorial.js',
        'lib/sugar/sugar.searchahead.js',
        'lib/sugar/sugar.timeago.js',
        'lib/sugar/sugar.ajaxcallInprogress.js',
    ),
);

//full sidecar stub
$buildFiles['sidecar'] = array(
        # Libraries
        'lib/handlebars/handlebars-1.0.rc.1.js',
        'lib/jquery/jquery.min.js',
        'lib/jquery-ui/js/jquery-ui-1.8.18.custom.min.js',
        'lib/backbone/underscore.js',
        'lib/backbone/backbone.js',
        'lib/stash/stash.js',
        'lib/async/async.js',
        'lib/jquery/jquery.iframe.transport.js',
        'lib/jquery/jquery.tinymce.js',
        'lib/php-js/version_compare.js',
        );

//combine the two to build out the full Sidecar.js
$buildFiles['sidecar'] = array_merge($buildFiles['sidecar'], $buildFiles['sidecar.lite']);
