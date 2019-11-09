var filePath = "shareddocuments://" + encodeURIComponent(args.fileURLs[0]).replace(/%2F/g, '/')
var folderPath = filePath.replace(/[^\/]*$/, '')

var alert = new Alert()
alert.title = "Copied folder path!"
alert.message = filePath
alert.addCancelAction("OK")
alert.present()

Pasteboard.copy(filePath)
