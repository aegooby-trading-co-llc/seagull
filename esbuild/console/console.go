package console

import (
	"fmt"

	"github.com/ttacon/chalk"
)

func Print(args ...any) {
	fmt.Print("   ")
	fmt.Println(args...)
}
func Log(args ...any) {
	fmt.Print(chalk.Bold.TextStyle("[esbuild:log]"), chalk.Reset, " ")
	fmt.Println(args...)
}
func Error(args ...any) {
	fmt.Print(chalk.Bold.TextStyle("[esbuild:err]"), chalk.Reset, " ")
	fmt.Println(args...)
}
