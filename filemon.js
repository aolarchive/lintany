var fs = require('fs'), util = require('util'), growl = require('growl'), jshint = require('jshint');

var failed = false, filepath = process.cwd()+'/'+process.argv.slice(2), linters = [], lintersFileFilter = [], lintersExcludeFileFilter = [], config = {};

util.print('Current directory: ' + process.cwd());
eval(fs.readFileSync(__dirname+'/config.js', encoding="ascii"));

for (var i = 0; i < config.linters.length; i++){
	var curlinter = config.linters[i], lintername = curlinter.name, linterFFilter = curlinter.fileFilter, linterEFFilter = curlinter.excludeFilter, successCommands = curlinter.successCommand;
	linters.push(require(lintername.toLowerCase())[lintername.toUpperCase()]);
	lintersFileFilter.push(linterFFilter);
	lintersExcludeFileFilter.push(linterEFFilter);
}

function walk(filepath, callback) {
	//util.print(filepath+"\n");
    fs.stat(filepath, function(err, stats) {
		if (err) throw err;
        if (stats.isFile() && filepath.match(lintersFileFilter[0])) {
            if (!lintersExcludeFileFilter[0] || !filepath.match(lintersExcludeFileFilter[0])){
                //util.print(filepath+"\n");
                monitorFile(filepath);
            }
        } else if (stats.isDirectory()) {
            fs.readdir(filepath, function(err, files) {
                for (var i = 0; i < files.length; i++) {
                    walk(filepath + '/' + files[i], callback);
                }
            });
        }
    });
};

function monitorFile(filename) {
    //util.print("\nmonitoring "+filename+"\n");
    fs.watchFile(filename, function(oc, nc) {
        //util.print(nc.mtime.getTime() +'|'+ oc.mtime.getTime());
        if (nc.mtime.getTime() !== oc.mtime.getTime()) {
            var src = fs.readFileSync(filename, "utf-8");
            util.print('checking '+filename+' for errors.\n');
            var curlinter = linters[0], success = curlinter(src), errmsg, errs, errlen, lasterrlen = 0;
			errs = curlinter.errors;
            errlen = errs.length;
			//util.print(!success +':'+ !failed +':'+ lasterrlen +':'+ errlen+'\n');
            if (!success && (!failed || lasterrlen >= errlen)) {
                errmsg = '';
                title = '"' + filename.replace(/.*\//, "").replace(/\.js/,"") + '" has problems\n';
                for (var i = 0; i < errlen; i++) {
                    var rawmsg = (curlinter.errors[i]) ? curlinter.errors[i].reason : "Unknown error", line = (curlinter.errors[i]) ? curlinter.errors[i].line + ':' + curlinter.errors[i].character : "X:X";
                    errmsg = errmsg + line + ' - ' + rawmsg;
					if (errlen -1 !== i){
						errmsg = errmsg + "\n\n";
					}
                }
                growl.notify(errmsg, {
                    title: title,
                    image: __dirname+'/no.png'
                });
                failed = true;
				lasterrlen = errlen;
            } else {
				if (!failed) {
					errmsg = 'Nice work!';
					title = '"' + filename.replace(/.*\//, "").replace(/\.js/,"") + '" passed\n';
					growl.notify(errmsg, {
						title: title,
						image: __dirname+'/yes.png'
					});
					failed = false;
					var sys = require('sys')
					var exec = require('child_process').exec;
					function puts(msg, successFilter) {
					    return function(error, stdout, stderr) {
					        //util.print('Error:'+error+' STDOut:'+stdout+' STDError:'+stderr);
                            util.print(stdout);
                            if (stdout.match(successFilter)){
                                growl.notify('Command Finish', {
                                    title: msg,
                                    image: __dirname+'/yes.png'
                                });
                            }else{
                                growl.notify('Error', {
                                    title: stdout,
                                    image: __dirname+'/no.png'
                                });
                            }
					    }
                    };
                    if (successCommands.length > 0){
                        for (var k = 0; k < successCommands.length; k++){
                            if (successCommands[k].beforeMsg){
                                growl.notify('Command Start', {
                                    title: successCommands[k].beforeMsg,
                                    image: __dirname+'/yes.png'
                                });
                            }
                            exec(successCommands[k].cmd,puts(successCommands[k].afterMsg, successCommands[k].successFilter));
                        }
                    }
				}
            }
            
        } else {
            failed = false;
        }
    });
};

walk(filepath);
