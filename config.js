/*config = {
    linters : [{
        name : 'JSHINT',
        fileFilter : /\.js$/,
        excludeFilter : /(spotagent\.js|spotagent-debug\.js|app-all\.js)$/,
        devType : ['js'],
        successCommand : [{
            beforeMsg : 'Builing SpotAgent',
            cmd : 'cd /Users/sheafrederick/MyWorkspace/SpotAgent/src/; sencha build -c -v -p spotagent.jsb3 -d static/js/',
            afterMsg : 'Builing SpotAgent - Complete',
        }],
        failureCommand : []
    }],
    debug : false
};*/

config = {
    linters : [{
        name : 'JSHINT',
        fileFilter : /.*(selfservice-js\/src\/main\/javascript|aop-aux\/src\/main\/javascript).*\.js$/,
        excludeFilter : undefined,
        devType : ['js'],
        successCommand : [{
            beforeMsg : 'Builing Shared JS',
            cmd : 'cd /Users/sheafrederick/Workspace/selfservice-js; mvn install -Dmaven.test.skip',
            afterMsg : 'Builing Shared JS - Complete',
            successFilter: /.*BUILD SUCCESS.*/
        },{
            beforeMsg : 'Builing AOP-AUX',
            cmd : 'cd /Users/sheafrederick/Workspace/aop-aux; mvn javascript:war-package -Dmaven.test.skip',
            afterMsg : 'Builing AOP-AUX - Complete',
            successFilter: /.*BUILD SUCCESS.*/
        }],
        failureCommand : []
    }],
    debug : false
};