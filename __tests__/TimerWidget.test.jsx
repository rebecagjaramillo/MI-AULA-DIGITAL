import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimerWidget } from '@/components/views/classroom-screen/widgets/TimerWidget'

describe('TimerWidget Component', () => {
  it('renders the initial timer value of 05:00', () => {
    render(<TimerWidget isDark={false} />)
    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('starts the timer when play button is clicked', () => {
    render(<TimerWidget isDark={false} />)
    const startButton = screen.getByText(/Iniciar/i)
    fireEvent.click(startButton)
    expect(screen.getByText(/Pausa/i)).toBeInTheDocument()
  })

  it('updates timer when quick minutes buttons are clicked', () => {
    render(<TimerWidget isDark={false} />)
    const tenMinButton = screen.getByText('10m')
    fireEvent.click(tenMinButton)
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })
})
