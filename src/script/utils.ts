


export function html_to_element(html: string): HTMLElement {
    const template = document.createElement('template');
    template.innerHTML = html.trim(); // Trim to remove any extra whitespace
    return template.content.firstChild as HTMLElement;
}


export function format_name(name: string): string {
    // capitalize the first letter of each word
    // minimize other
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function format_string(str: string): string {
    // first letter uppercase, rest lowercase
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}