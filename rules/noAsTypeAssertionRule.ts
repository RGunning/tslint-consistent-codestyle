import { isAsExpression, isTypeAssertion } from '../src/typeguard';
import { getChildOfKind } from '../src/utils';
import * as ts from 'typescript';
import * as Lint from 'tslint';

const FAIL_MESSAGE = 'use <Type> instead of `as Type`';

export class Rule extends Lint.Rules.AbstractRule {
    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new AsExpressionWalker(sourceFile, this.getOptions()));
    }
}

export class AsExpressionWalker extends Lint.RuleWalker {
    private _visitAsExpression(node: ts.AsExpression) {
        const sourceFile = this.getSourceFile();
        const end = node.getEnd();
        const expressionEnd = node.expression.getEnd();
        const fix = new Lint.Fix('no-as-type-assertion', [
            this.createReplacement(getInsertionPosition(node, sourceFile), 0, `<${node.type.getText(sourceFile)}>`),
            this.createReplacement(expressionEnd, end - expressionEnd, ''),
        ]);
        const start = getChildOfKind(node, ts.SyntaxKind.AsKeyword, sourceFile)!.getStart(sourceFile);
        this.addFailure(this.createFailure(start, end - start, FAIL_MESSAGE, fix));
    }

    public walk(node: ts.Node) {
        const cb = (child: ts.Node) => {
            if (child.kind === ts.SyntaxKind.AsExpression)
                this._visitAsExpression(<ts.AsExpression>child);
            ts.forEachChild(child, cb);
        };
        ts.forEachChild(node, cb);
    }
}

function getInsertionPosition(node: ts.AsExpression, sourceFile: ts.SourceFile): number {
        let expression = node.expression;
        while (isTypeAssertion(expression) || isAsExpression(expression)) {
            expression = expression.expression;
        }
        return expression.getStart(sourceFile);
}