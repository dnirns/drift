import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SavePresetModal from '@/components/SavePresetModal';

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
};

beforeEach(() => {
  defaultProps.onClose = jest.fn();
  defaultProps.onSave = jest.fn();
});

describe('SavePresetModal', () => {
  it('renders title and buttons when visible', () => {
    render(<SavePresetModal {...defaultProps} />);

    expect(screen.getByText('Save Preset')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('does not call onSave when name is empty', () => {
    render(<SavePresetModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Save'));
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed name', () => {
    render(<SavePresetModal {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter preset name...'), '  My Preset  ');
    fireEvent.press(screen.getByText('Save'));

    expect(defaultProps.onSave).toHaveBeenCalledWith('My Preset');
  });

  it('clears input after saving', () => {
    render(<SavePresetModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter preset name...');
    fireEvent.changeText(input, 'Test');
    fireEvent.press(screen.getByText('Save'));

    expect(input.props.value).toBe('');
  });

  it('calls onClose and clears input on cancel', () => {
    render(<SavePresetModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter preset name...');
    fireEvent.changeText(input, 'Test');
    fireEvent.press(screen.getByText('Cancel'));

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(input.props.value).toBe('');
  });

  it('disables save button when input is whitespace only', () => {
    render(<SavePresetModal {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter preset name...'), '   ');
    fireEvent.press(screen.getByText('Save'));

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });
});
