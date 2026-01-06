export const getVintageLabel = (year: number | null | undefined): string => {
    if (!year || year === 0) return "ALL";
    return year.toString();
};
