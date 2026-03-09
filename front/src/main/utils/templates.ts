import { Language } from '../types'

export const TEMPLATES: Record<Language, string> = {
  py: '# Python Script\nprint("Hello, World!")\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  js: '// JavaScript\nconsole.log("Hello, World!");\n',
}
