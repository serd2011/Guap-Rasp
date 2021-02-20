$(document).ready(ready);

function ready() {
    $(".select").each(function () {
        let select = $(this);
        let head = $(".select-head", this);
        let input = $("input", this);
        let options = {};

        head.click(function (e) {
            e.stopPropagation();
            select.toggleClass("active");
        });

        $(".select-options > div", this).each(function () {
            let val = $(this).data("value");
            options[val] = { div: $(this), text: $(this).text() };
            $(this).click(function () {
                input.val(val).change();
            });
        });

        input.change(input_changed);
        input.on("value:changed", input_changed);

        $(document).click(function () {
            select.removeClass("active");
        });

        function input_changed() {
            let val = input.val();
            for (let i in options) {
                options[i].div.show();
            }
            options[val].div.hide();
            head.text(options[val].text);
        }
    });


    $(".select-search").each(function () {
        let select = $(this);
        let input = $("input", this);
        let options_wrapper = $(".select-options-wrapper", select);
        let options = $(".select-options", select);

        input.focus(function () {
            select.addClass("active");
            find();
        });

        input.focusout(function () {
            select.removeClass("active");
        });

        input.keyup(find);

        restart();

        options.on("select:reload", restart);

        function restart() {
            options.removeClass("needInnerShadow");
            $("> div", options).each(function () {
                $(this).mousedown(function () {
                    input.val($(this).text()).change();
                });
            });
            checkHeight();
        }

        function checkHeight() {
            if (options.is(":visible")) {
                options.css("display", "block");
            }
            if (options[0].scrollHeight > options[0].clientHeight) {
                options_wrapper.addClass("needInnerShadow");
            } else {
                options_wrapper.removeClass("needInnerShadow");
            }
            options.css("display", "");
        }

        function find() {
            let text = input.val().toLowerCase();
            $(".select-options > div", select).each(function () {
                if ($(this).text().toLowerCase().includes(text))
                    $(this).show();
                else
                    $(this).hide();
            });
            checkHeight();
        }
    });
}
