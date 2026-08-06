function dateToString (date: Date, format: string): string {
    return format.replace(/(yyyy|MM|dd|HH|mm|ss)/g, (match) => {
        switch (match) {
            case 'yyyy':
                return date.getFullYear().toString();
            case 'MM':
                return (date.getMonth() + 1).toString().padStart(2, '0');
            case 'dd':
                return date.getDate().toString().padStart(2, '0');
            case 'HH':
                return date.getHours().toString().padStart(2, '0');
            case 'mm':
                return date.getMinutes().toString().padStart(2, '0');
            case 'ss':
                return date.getSeconds().toString().padStart(2, '0');
            default:
                return match;
        }
    }) 
};

export { dateToString };