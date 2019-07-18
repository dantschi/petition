// is is a good way to export multiple functions
module.exports = {
    requireNoSignature
};

function requireNoSignature(req, res, next) {
    if (req.session.signatureId) {
        //if signatureId exists, this block runs
        //if there is a signature, go to page /signed
        res.redirect("/signed");
    } else {
        //next is a function we have to call in EVERY middleware we ever write
        next();
    }
}
