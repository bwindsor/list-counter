export function validateStoryName(s: string, existingNames: string[]) {
    return existingNames.indexOf(s) === -1 && s.trim().length > 3 && s.trim().length <= 100
}