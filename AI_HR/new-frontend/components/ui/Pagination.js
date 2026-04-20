import { Pagination as BsPagination } from 'react-bootstrap'

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxPagesToShow = 5 
}) {
  if (totalPages <= 1) return null

  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  const adjustedStartPage = Math.max(1, endPage - maxPagesToShow + 1)

  const pages = []
  for (let i = adjustedStartPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="d-flex justify-content-between align-items-center">
      <div className="pagination-info">
        <small className="text-muted">
          Page {currentPage} of {totalPages}
        </small>
      </div>

      <BsPagination className="mb-0">
        <BsPagination.First 
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        />
        <BsPagination.Prev 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />

        {adjustedStartPage > 1 && (
          <>
            <BsPagination.Item onClick={() => onPageChange(1)}>
              1
            </BsPagination.Item>
            {adjustedStartPage > 2 && <BsPagination.Ellipsis />}
          </>
        )}

        {pages.map(page => (
          <BsPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </BsPagination.Item>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <BsPagination.Ellipsis />}
            <BsPagination.Item onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </BsPagination.Item>
          </>
        )}

        <BsPagination.Next 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <BsPagination.Last 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </BsPagination>
    </div>
  )
}