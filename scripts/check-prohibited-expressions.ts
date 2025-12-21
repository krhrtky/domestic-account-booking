import * as fs from 'fs'
import * as path from 'path'

const PROHIBITED_PATTERNS = {
  superiority: [
    /完璧/g,
    /100%/g,
    /絶対/g,
    /必ず/g,
    /確実/g,
    /業界No\.?1/gi,
    /最高/g,
    /最強/g,
    /究極/g,
    /唯一/g,
  ],
  professionalAdvice: [
    /節税/g,
    /確定申告/g,
    /税金が減る/g,
    /投資判断/g,
    /資産運用/g,
    /利益が出る/g,
    /法的に有効/g,
    /契約として成立/g,
  ],
  discrimination: [
    /主婦向け/g,
    /男性の稼ぎ/g,
    /女性の家事/g,
    /貧乏/g,
    /金持ち/g,
    /低所得/g,
    /頭が悪い/g,
    /馬鹿でもわかる/g,
  ],
  fearAppeal: [
    /損する/g,
    /危険/g,
    /今すぐやらないと/g,
    /今だけ/g,
    /期間限定/g,
    /急いで/g,
    /後悔/g,
    /もったいない/g,
  ],
}

interface Violation {
  file: string
  line: number
  column: number
  category: string
  match: string
  context: string
}

const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']
const EXCLUDED_DIRS = ['node_modules', '.next', 'dist', 'build', 'coverage', 'test-results', 'storybook-static']
const EXCLUDED_FILES = ['check-prohibited-expressions.ts']
const EXCLUDED_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /__tests__/,
]

const FALSE_POSITIVE_PATTERNS = [
  /width="100%"/,
  /height="100%"/,
  /100%である必要があります/,
]

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
        getAllFiles(fullPath, files)
      }
    } else if (entry.isFile()) {
      const isExcludedByPattern = EXCLUDED_PATTERNS.some((pattern) =>
        pattern.test(fullPath)
      )
      if (
        TARGET_EXTENSIONS.includes(path.extname(entry.name)) &&
        !EXCLUDED_FILES.includes(entry.name) &&
        !isExcludedByPattern
      ) {
        files.push(fullPath)
      }
    }
  }

  return files
}

function isFalsePositive(line: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some((pattern) => pattern.test(line))
}

function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (const [category, patterns] of Object.entries(PROHIBITED_PATTERNS)) {
    for (const pattern of patterns) {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex]

        if (isFalsePositive(line)) {
          continue
        }

        let match: RegExpExecArray | null

        const regex = new RegExp(pattern.source, pattern.flags)
        while ((match = regex.exec(line)) !== null) {
          const start = Math.max(0, match.index - 20)
          const end = Math.min(line.length, match.index + match[0].length + 20)
          const context = line.substring(start, end)

          violations.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            category,
            match: match[0],
            context: `...${context}...`,
          })
        }
      }
    }
  }

  return violations
}

function main() {
  const rootDir = process.cwd()
  const srcDir = path.join(rootDir, 'src')
  const appDir = path.join(rootDir, 'app')

  console.log('L-LC-004: Checking for prohibited expressions...\n')

  const files: string[] = []
  if (fs.existsSync(srcDir)) {
    getAllFiles(srcDir, files)
  }
  if (fs.existsSync(appDir)) {
    getAllFiles(appDir, files)
  }

  console.log(`Scanning ${files.length} files...\n`)

  const allViolations: Violation[] = []

  for (const file of files) {
    const violations = checkFile(file)
    allViolations.push(...violations)
  }

  if (allViolations.length === 0) {
    console.log('✓ No prohibited expressions found.\n')
    console.log('Categories checked:')
    console.log('  - Superiority claims (完璧, 絶対, 業界No.1, etc.)')
    console.log('  - Professional advice (節税, 確定申告, etc.)')
    console.log('  - Discrimination (主婦向け, etc.)')
    console.log('  - Fear appeals (損する, 今だけ, etc.)')
    process.exit(0)
  }

  console.log(`✗ Found ${allViolations.length} prohibited expression(s):\n`)

  const groupedByFile = allViolations.reduce(
    (acc, v) => {
      if (!acc[v.file]) acc[v.file] = []
      acc[v.file].push(v)
      return acc
    },
    {} as Record<string, Violation[]>
  )

  for (const [file, violations] of Object.entries(groupedByFile)) {
    const relativePath = path.relative(rootDir, file)
    console.log(`\n${relativePath}:`)
    for (const v of violations) {
      console.log(`  Line ${v.line}:${v.column} [${v.category}]`)
      console.log(`    Match: "${v.match}"`)
      console.log(`    Context: ${v.context}`)
    }
  }

  console.log('\n')
  console.log('Please remove or replace these expressions to comply with L-LC-004.')
  console.log('See: docs/laws/03-legal-compliance.md')

  process.exit(1)
}

main()
