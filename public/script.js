(function() {
    $(document).ready(function() {
        var canvas = document.getElementById("signature");

        try {
            var ctx = canvas.getContext("2d");
            var dataUrl = canvas.toDataURL();
            var cnvLeft = $("canvas").offset().left;
            var cnvTop = $("canvas").offset().top;
        } catch (err) {
            console.log(err);
        }

        var button = $("#btn-signed");
        var canvasClicked = false;
        var menuOpen = document.getElementById("menu-open");
        var closeIt = document.getElementById("close-it");
        var sideBar = document.getElementById("sidebar");
        var overlay = document.getElementById("overlay");
        var anchors = document.getElementsByTagName("A");

        var bottomFixed = $("#bottom-fixed");
        var slide = $(".slide");
        // var wrapper = $(".wrapper");

        console.log(anchors);

        for (var i = 0; i < anchors.length; i++) {
            anchors[i].addEventListener("click", function(e) {
                console.log(anchors);
                e.stopPropagation();
            });
        }

        var scrolledFromTop = $(document).scrollTop();

        timer(goUpVisible(), 250);

        function timer(fn, ms) {
            var lastCall = null;
            var now = +new Date();
            console.log(now, lastCall, now - lastCall);
            if (now - lastCall > ms) {
                fn;
                lastCall = now;
            }
            lastCall = now;
        }

        function goUpVisible() {
            if (scrolledFromTop > 500) {
                console.log("goUpVisible called");
                bottomFixed.addClass("visible");
                timer(goUpVisible(), 250);
            } else {
                if (bottomFixed.hasClass("visible")) {
                    bottomFixed.removeClass("visible");
                    timer(goUpVisible(), 250);
                }
            }
        }

        menuOpen.addEventListener("click", function(e) {
            console.log(event);
            e.stopPropagation();
            sideBar.classList.add("onscreen");
            overlay.classList.add("overlay");
            slide.addClass("left");
            // wrapper.addClass("scaled");
        });

        closeIt.addEventListener("click", function(e) {
            e.stopPropagation();
            sideBar.classList.remove("onscreen");
            overlay.classList.remove("overlay");
            slide.removeClass("left");
            // wrapper.removeClass("scaled");
        });

        overlay.addEventListener("click", function(e) {
            e.stopPropagation();
            sideBar.classList.remove("onscreen");
            overlay.classList.remove("overlay");
            slide.removeClass("left");
            // wrapper.removeClass("scaled");
        });

        var lastX = 0;
        var lastY = 0;
        var mouseDown = false;

        var cnv = $("canvas");
        // var cnvWidth = $("canvas").outerWidth();
        // var cnvHeight = $("canvas").outerHeight();

        // console.log(cnvHeight, cnvWidth, cnvLeft, cnvTop);

        $("body").on("mousedown", function() {
            console.log(canvasClicked);
        });

        if (canvasClicked == true) {
            button.on("mousedown", function(event) {
                event.preventDefault();
                console.log(canvasClicked);
                // console.log(isCanvasEmpty());
                var firstName = $('input[name="first_name"]');
                var lastName = $('input[name="last_name"]');
                if (
                    firstName == "" ||
                    lastName == "" ||
                    canvasClicked == false
                ) {
                    alert("Please fill all fields and sign the petition!");
                    return;
                } else {
                    console.log(dataUrl);
                    $("form").submit();
                }
            });
        }

        cnv.on("mousedown touchstart", function(event) {
            // console.log($(event)[0].originalEvent.touches[0]);
            mouseDown = true;
            canvasClicked = true;
            if ($(event)[0].type == "touchstart") {
                lastX = event.originalEvent.touches[0].pageX - cnvLeft;
                lastY = event.originalEvent.touches[0].pageY - cnvTop;
                draw(lastX, lastY);
            } else {
                draw(event.pageX - cnvLeft, event.pageY - cnvTop);
            }
            event.preventDefault();
        });
        cnv.on("mousemove touchmove", function(event) {
            // console.log($(event).type == "touchmove");
            if ($(event)[0].type == "touchmove") {
                draw(
                    $(event)[0].originalEvent.touches[0].pageX - cnvLeft,
                    $(event)[0].originalEvent.touches[0].pageY - cnvTop
                );
            } else {
                draw(event.pageX - cnvLeft, event.pageY - cnvTop);
            }
            event.preventDefault();
        });

        cnv.on("mouseup mouseleave touchend", function() {
            console.log(event);
            mouseDown = false;
        });

        cnv.on("mouseup touchend", function() {
            console.log(event);
            dataUrl = canvas.toDataURL();
            $('input[name="signature"]').val(dataUrl);
        });

        function draw(x, y) {
            // dataUrl = canvas.toDataURL();
            // console.log(evt);
            if (mouseDown) {
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.lineWidth = "1px";
                ctx.lineJoin = "round";
                ctx.moveTo(lastX, lastY);
                // lastX = evt.pageX;
                // lastY = evt.pageY;
                ctx.lineTo(x, y);

                ctx.closePath();
                ctx.stroke();

                console.log(lastX, lastY);
            }
            lastX = x;
            lastY = y;
        }

        // function isCanvasEmpty(cnv) {
        //     var pixelBuffer = new Uint32Array(
        //         ctx.getImageData(0, 0, cnv.width, cnv.height)
        //     );
        //
        //     console.log(pixelBuffer, cnv.width, cnv.height);
        //     return !pixelBuffer.some(function(colored) {
        //         return colored === 0;
        //     });
        // }
    });
})();
