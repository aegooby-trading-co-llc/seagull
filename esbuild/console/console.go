package console

import (
	"fmt"

	"github.com/ttacon/chalk"
)

var blueBold = chalk.Bold.NewStyle().
	WithBackground(chalk.ResetColor).
	WithForeground(chalk.Blue)
var redBold = chalk.Bold.NewStyle().
	WithBackground(chalk.ResetColor).
	WithForeground(chalk.Red)
var greenBold = chalk.Bold.NewStyle().
	WithBackground(chalk.ResetColor).
	WithForeground(chalk.Green)
var yellowBold = chalk.Bold.NewStyle().
	WithBackground(chalk.ResetColor).
	WithForeground(chalk.Yellow)

func Log(args ...any) {
	fmt.Print(blueBold.Style("[*]"), chalk.Reset, " ")
	fmt.Println(args...)
}
func Error(args ...any) {
	fmt.Print(redBold.Style("[!]"), chalk.Reset, " ")
	fmt.Println(args...)
}
func Success(args ...any) {
	fmt.Print(greenBold.Style("[$]"), chalk.Reset, " ")
	fmt.Println(args...)
}
func Warn(args ...any) {
	fmt.Print(yellowBold.Style("[?]"), chalk.Reset, " ")
	fmt.Println(args...)
}
