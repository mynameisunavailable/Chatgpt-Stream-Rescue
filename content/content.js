var state = {
    error_base: ".text-token-text-error",
    last_message_id: null,
    last_html: "",
    best_html: "",
    prev_best_html: "",
    last_node: null,
    last_obs: null
};
state.error_message = `${state.error_base}:not([data-restored="1"])`;

function all_to_arr(str)
{
    const all_messages = document.querySelectorAll(str);
    const all_messages_array = Array.from(all_messages);
    return (all_messages_array);
}

function last(arr)
{
    let size = arr.length;
    if (size > 0) {
        return (arr[size - 1]);
    }
    return (null);
}

function get_last_message()
{
    var sels = [
        '.markdown.prose',
        'div.markdown.prose',
        'div.prose',
        '.prose'
    ];
    for (let i = 0; i < sels.length; i++) {
        let node = all_to_arr(sels[i]);
        if (node.length > 0) {
            return (last(node));
        }
    }
    return null;
}

function insert_message(HTMLmessage)
{
    const error_node = last(all_to_arr(state.error_message));
    if (error_node == null || HTMLmessage == null) return;

    const prev = error_node.previousElementSibling;
    if (prev != null && prev.getAttribute("data-restored") == "1") return;

    const restore_div = document.createElement("div");
    restore_div.className = "restored-message markdown prose dark:prose-invert";
    restore_div.innerHTML = HTMLmessage;
    restore_div.setAttribute("data-restored", "1");

    error_node.parentNode.insertBefore(restore_div, error_node);
    error_node.setAttribute("data-restored", "1");
}

function stubborn_insert_message(HTMLmessage, maxTries = 10, interval = 1000) {
    let tries = 0;
    const timer = setInterval(() => {
        const err = document.querySelector(state.error_message);
        if (!err) {
            clearInterval(timer);
            return;
        }
        insert_message(HTMLmessage);
        tries++;
        if (document.querySelector('.restored-message') || tries >= maxTries) {
            clearInterval(timer);
        }
    }, interval);
    insert_message(HTMLmessage);
}

function monitor(node)
{
    if (node == null){
        return ;
    }

    if (state.last_obs != null && state.last_node != null){
        state.last_obs.disconnect();
        if (state.best_html.length > 100){
            state.prev_best_html = state.best_html;
        }
    }

    state.last_html = "";
    state.best_html = "";

    state.last_obs = new MutationObserver(() => {
    const err = document.querySelector(state.error_message);
        if (err) {

            state.last_obs.disconnect();
            setTimeout(() => stubborn_insert_message(state.prev_best_html), 1500);
            return;
        }

        const HTMLmessage = node.innerHTML;
        if (!HTMLmessage) return;

        if (state.last_html && HTMLmessage.length + 8 < state.last_html.length) return;

        if (HTMLmessage !== state.last_html){
            state.last_html = HTMLmessage;
            if (HTMLmessage.length > state.best_html.length) {
                state.best_html = HTMLmessage;
            }
        }
    });
    const main = document.querySelector('main') || document.body;
    state.last_obs.observe(main, {
        childList:      true,
        subtree:        true,
    });

    state.last_node = node;
}

function main()
{
    const top = document.querySelector("main");
    if (top == null){
        return setTimeout(main, 500);
    }
    
    const new_reply_obs = new MutationObserver(() => {
        const node = get_last_message();
        if (node == null) return;

        const msg_id = node.getAttribute && node.getAttribute('data-message-id');
        if (msg_id) {
            if (msg_id === state.last_message_id) return; 
            state.last_message_id = msg_id;
        } else if (node === state.last_node) {
            return; 
        }
        
        if (node != null && node !== state.last_node){
            monitor(node);
        }
    });
    new_reply_obs.observe(top, {
        childList:  true,
        subtree:    true,
    });
    
    const node = get_last_message();
    if (node != null){
        monitor(node);
    }
}

main()