/*
 * Longest common subsequence implementation, for diffing arrays
 * Reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 */

type NumberArray = number[]
type LengthMatrix = NumberArray[]
type Subsequence<E> = {
  sequence: E[]
  prevIndices: number[]
  nextIndices: number[]
}

export function getLongestCommonSubsequence<E>(previous: E[], next: E[]): Subsequence<E> {
  const matrix = getLengthMatrix(previous, next)
  const result = backtrack(matrix, previous, next)
  return result
}

function getLengthMatrix<E>(previous: E[], next: E[]): LengthMatrix {
  const len1 = previous.length
  const len2 = next.length
  let x = 0
  let y = 0

  // initialize empty matrix of len1+1 x len2+1
  const matrix: LengthMatrix = new Array(len1 + 1)
  for (x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1]
    for (y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0
    }
  }

  // save sequence lengths for each coordinate
  for (x = 1; x < len1 + 1; x++) {
    for (y = 1; y < len2 + 1; y++) {
      if (previous[x - 1] === next[y - 1]) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1])
      }
    }
  }

  return matrix
}

function backtrack<E>(matrix: LengthMatrix, previous: E[], next: E[]): Subsequence<E> {
  let prevIndex = previous.length
  let nextIndex = next.length
  const subsequence: Subsequence<E> = {
    sequence: [],
    prevIndices: [],
    nextIndices: [],
  }

  while (prevIndex !== 0 && nextIndex !== 0) {
    const areEqual = previous[prevIndex - 1] === next[nextIndex - 1]
    if (areEqual) {
      subsequence.sequence.unshift(previous[prevIndex - 1])
      subsequence.prevIndices.unshift(prevIndex - 1)
      subsequence.nextIndices.unshift(nextIndex - 1)
      --prevIndex
      --nextIndex
    } else {
      const valueAtMatrixAbove = matrix[prevIndex][nextIndex - 1]
      const valueAtMatrixLeft = matrix[prevIndex - 1][nextIndex]
      if (valueAtMatrixAbove > valueAtMatrixLeft) {
        --nextIndex
      } else {
        --prevIndex
      }
    }
  }
  return subsequence
}
