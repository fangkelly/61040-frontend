import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface CommentDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  target: ObjectId;
}

export default class CommentConcept {
  public readonly comments = new DocCollection<CommentDoc>("comments");

  /** add new comment */
  async create(author: ObjectId, content: string, target: ObjectId) {
    if (!content) {
      throw new CommentContentEmptyError();
    }

    if (!target) {
      throw new CommentNoTargetError();
    }

    target = new ObjectId(target.toString());

    const _id = await this.comments.createOne({ author, content, target });
    return { msg: "Comment successfully created!", comment: await this.comments.readOne({ _id }) };
  }

  /** get comments that match filter */
  async getComments(query: Filter<CommentDoc>) {
    const events = await this.comments.readMany(query, {
      sort: { dateCreated: 1 },
    });
    return events;
  }

  /** get comments by target */
  async getByPost(target: ObjectId) {
    target = new ObjectId(target.toString());
    return await this.getComments({ target });
  }

  /** edit comment */
  async update(_id: ObjectId, update: Partial<CommentDoc>) {
    this.sanitizeUpdate(update);
    await this.comments.updateOne({ _id }, update);
    return { msg: "Comment succesfully updated!" };
  }

  /** delete comment */
  async delete(_id: ObjectId) {
    await this.comments.deleteOne({ _id });
    return { msg: "Comment deleted successfully!" };
  }

  private sanitizeUpdate(update: Partial<CommentDoc>) {
    if (!update) {
      throw new CommentUpdateEmptyError();
    }
    // Make sure the update cannot change the author or target.
    const allowedUpdates = ["content"];
    for (const [key, value] of Object.entries(update)) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }

      if (key === "content" && !value) {
        throw new CommentContentEmptyError();
      }
    }
  }

  /** check if user is the author of the comment */
  async isAuthor(user: ObjectId, _id: ObjectId) {
    const comment = await this.comments.readOne({ _id });
    if (!comment) {
      throw new NotFoundError(`Comment ${_id} does not exist!`);
    }
    if (comment.author.toString() !== user.toString()) {
      throw new CommentAuthorNotMatchError(user, _id);
    }
  }
}

export class CommentAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of comment {1}!", user, _id);
  }
}

export class CommentNoTargetError extends BadValuesError {
  constructor() {
    super("Cannot create a comment without a target!!");
  }
}

export class CommentContentEmptyError extends BadValuesError {
  constructor() {
    super("Can not create comment with empty content!");
  }
}

export class CommentUpdateEmptyError extends BadValuesError {
  constructor() {
    super("Empty values for comment update!");
  }
}
